import {
  Menu,
  Star,
  MessageSquare,
  Filter,
  Search,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";


const reviews = [
  {
    id: "R001",
    product: "Wireless Headphones",
    customer: "John Smith",
    rating: 5,
    comment: "Amazing quality! Great sound and comfortable.",
    date: "2024-01-15",
    status: "Published",
  },
  {
    id: "R002",
    product: "Smart Watch",
    customer: "Sarah Johnson",
    rating: 4,
    comment: "Good product but battery life could be better.",
    date: "2024-01-14",
    status: "Published",
  },
  {
    id: "R003",
    product: "USB Cable",
    customer: "Mike Davis",
    rating: 2,
    comment: "Stopped working after a week.",
    date: "2024-01-13",
    status: "Pending",
  },
  {
    id: "R004",
    product: "Phone Case",
    customer: "Emily Brown",
    rating: 5,
    comment: "Perfect fit and excellent protection!",
    date: "2024-01-12",
    status: "Published",
  },
];

const questions = [
  {
    id: "Q001",
    product: "Wireless Headphones",
    customer: "Alex Wilson",
    question: "Are these compatible with iPhone 15?",
    date: "2024-01-16",
    answered: false,
  },
  {
    id: "Q002",
    product: "Smart Watch",
    customer: "Lisa Garcia",
    question: "What is the battery life?",
    date: "2024-01-15",
    answered: true,
  },
  {
    id: "Q003",
    product: "USB Cable",
    customer: "Tom Johnson",
    question: "What is the cable length?",
    date: "2024-01-14",
    answered: false,
  },
];

export const ReviewsManagement = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reviews & Q&A</h1>
            <p className="text-gray-600 mt-1">
              Manage customer reviews and answer questions
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">4.6</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unanswered Q&A</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <ThumbsDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Reviews</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search reviews..." className="pl-10 w-64" />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Review ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">{review.id}</TableCell>
                  <TableCell>{review.product}</TableCell>
                  <TableCell>{review.customer}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm">{review.rating}/5</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {review.comment}
                  </TableCell>
                  <TableCell>{review.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        review.status === "Published" ? "default" : "secondary"
                      }
                    >
                      {review.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm">
                        Moderate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Q&A Section */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">{question.id}</TableCell>
                  <TableCell>{question.product}</TableCell>
                  <TableCell>{question.customer}</TableCell>
                  <TableCell className="max-w-xs">
                    {question.question}
                  </TableCell>
                  <TableCell>{question.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={question.answered ? "default" : "destructive"}
                    >
                      {question.answered ? "Answered" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      {question.answered ? "Edit Answer" : "Answer"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
